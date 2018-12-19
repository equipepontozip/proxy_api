FROM nickgryg/alpine-pandas:3.6.6

WORKDIR /api

ENV FLASK_APP=proxy_api.py
ENV FLASK_ENV=development

ADD requirements.txt /api

RUN pip install -r requirements.txt

ADD . /api

EXPOSE 5000

CMD ["flask", "run", "-h", "0.0.0.0", "-p", "5000"]
